import * as ort from 'onnxruntime-web';
import { env, AutoTokenizer } from '@huggingface/transformers';
import timer from '../../core/timer.js';

env.localModelPath = '/dev/copilot/onnx_model/';
env.allowRemoteModels = false;
env.allowLocalModels = true;

let tokenizer;
let session;
let conversationIds = [];

function detectNumLayers(session) {
    let maxLayer = -1;
    for (let name of session.inputNames) {
        const match = name.match(/past_key_values\.(\d+)\.key/);
        if (match) {
            maxLayer = Math.max(maxLayer, parseInt(match[1], 10));
        }
    }
    return maxLayer + 1; // 層數 = 最大 index + 1
}

function selectNextToken(logits, k = 50) {
    // 轉成機率分布
    const probs = softmax(logits);

    // 找前 k 名
    const sorted = probs
        .map((p, i) => ({ p, i }))
        .sort((a, b) => b.p - a.p)
        .slice(0, k);

    // 隨機挑一個
    let r = Math.random();
    let cum = 0;
    for (let { p, i } of sorted) {
        cum += p;
        if (r < cum) return i;
    }
    return sorted[0].i; // 保底
}

function softmax(logits) {
    // 找最大值
    let max = -Infinity;
    for (let i = 0; i < logits.length; i++) {
        if (logits[i] > max) max = logits[i];
    }

    // 計算 exp
    const exps = new Array(logits.length);
    let sum = 0;
    for (let i = 0; i < logits.length; i++) {
        exps[i] = Math.exp(logits[i] - max);
        sum += exps[i];
    }

    // 正規化
    for (let i = 0; i < exps.length; i++) {
        exps[i] /= sum;
    }
    return exps;
}

const numHeads = 12;       // 注意力頭數
const headSize = 64;      // 每個 head 的維度

function createEmptyPast(numLayers, batchSize, numHeads, headSize) {
    const past = [];
    for (let i = 0; i < numLayers; i++) {
        past.push({
            key: new ort.Tensor("float32", new Float32Array(0), [batchSize, numHeads, 0, headSize]),
            value: new ort.Tensor("float32", new Float32Array(0), [batchSize, numHeads, 0, headSize])
        });
    }
    return past;
}

async function chat(inputText, maxTokens = 20) {
    // encode 使用者輸入
    const encoded = await tokenizer.encode(inputText);
    conversationIds.push(...encoded);

    let outputText = "";
    let pastKeyValues = createEmptyPast(4, 1, 4, 32);

    for (let i = 0; i < maxTokens; i++) {
        // 第一次生成送整段，之後只送最後一個 token + past_key_values
        const inputIds = pastKeyValues ? [conversationIds[conversationIds.length - 1]] : conversationIds;
        const inputTensor = new ort.Tensor(
            "int32",
            Int32Array.from(inputIds),
            [1, inputIds.length]
        );
        const attentionMask = new ort.Tensor(
            "int32",
            Int32Array.from([1]), // 只有一個 token
            [1, 1]
        );

        const feeds = { input_ids: inputTensor, attention_mask: attentionMask };

        // 只有當 pastKeyValues 已存在時才加進去
        if (pastKeyValues) {
            pastKeyValues.forEach((pkv, idx) => {
                feeds[`past_key_values.${idx}.key`] = pkv.key;
                feeds[`past_key_values.${idx}.value`] = pkv.value;
            });
        }

        const outputs = await session.run(feeds);

        // 更新 past_key_values
        pastKeyValues = [];
        let idx = 0;
        while (outputs.hasOwnProperty(`present.${idx}.key`)) {
            pastKeyValues.push({
                key: outputs[`present.${idx}.key`],
                value: outputs[`present.${idx}.value`]
            });
            idx++;
        }

        // 取 logits
        const logitsData = outputs.logits.data;
        const vocabSize = tokenizer.vocab_size;
        const lastLogits = logitsData.slice(logitsData.length - vocabSize);

        const nextTokenId = selectNextToken(lastLogits);

        if (nextTokenId === tokenizer.eosTokenId) break;

        conversationIds.push(nextTokenId);

        const decoded = await tokenizer.decode([nextTokenId]);
        outputText += decoded;
    }

    return outputText;
}

async function generateText(inputText, maxTokens = 200) {
    const encoded = await tokenizer.encode(inputText);
    const conversationIds = [...encoded];

    let outputText = "";
    let pastKeyValues = createEmptyPast(detectNumLayers(session), 1, numHeads, headSize);

    for (let i = 0; i < maxTokens; i++) {
        const inputIds = pastKeyValues[0].key.data.length === 0 ? conversationIds : [conversationIds[conversationIds.length - 1]];
        // input_ids → int64
        const inputTensor = new ort.Tensor(
            "int64",
            BigInt64Array.from(inputIds.map(BigInt)),
            [1, inputIds.length]
        );

        // attention_mask → int64
        const attentionMask = new ort.Tensor(
            "int64",
            BigInt64Array.from(inputIds.map(() => 1n)),
            [1, inputIds.length]
        );

        // position_ids → int64
        const startPos = pastKeyValues[0].key.data.length === 0 ? 0 : conversationIds.length - 1;
        const positionIds = new ort.Tensor(
            "int64",
            BigInt64Array.from(inputIds.map((_, idx) => BigInt(startPos + idx))),
            [1, inputIds.length]
        );

        const feeds = {
            input_ids: inputTensor,
            attention_mask: attentionMask,
            position_ids: positionIds
        };

        pastKeyValues.forEach((pkv, idx) => {
            feeds[`past_key_values.${idx}.key`] = pkv.key;
            feeds[`past_key_values.${idx}.value`] = pkv.value;
        });

        const outputs = await session.run(feeds);

        pastKeyValues = [];
        let idx = 0;
        while (outputs.hasOwnProperty(`present.${idx}.key`)) {
            pastKeyValues.push({
                key: outputs[`present.${idx}.key`],
                value: outputs[`present.${idx}.value`]
            });
            idx++;
        }

        const logitsData = outputs.logits.data;
        const vocabSize = tokenizer.vocab_size;
        const lastLogits = logitsData.slice(logitsData.length - vocabSize);
        const nextTokenId = selectNextToken(lastLogits);

        // console.log("nextTokenId:", nextTokenId);
        // console.log("decoded raw:", await tokenizer.decode([nextTokenId], { skip_special_tokens: false }));

        if (nextTokenId === tokenizer.eosTokenId) break;

        conversationIds.push(nextTokenId);
        const decoded = await tokenizer.decode([nextTokenId]);
        outputText += decoded;
    }

    return outputText;
}

async function init() {
    tokenizer = await AutoTokenizer.from_pretrained("/dev/copilot/onnx_model/");
    timer.mark('Initializing tokenizer');

    session = await ort.InferenceSession.create("../dev/copilot/onnx_model/model.onnx");
    timer.mark('Loading model');
    console.log(session.inputNames);
    return { chat, generateText };
}

export default init;