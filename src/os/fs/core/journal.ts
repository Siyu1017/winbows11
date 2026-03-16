import { Driver } from "../drivers/driver";
import { serialize, deserialize } from "../utils/serialize";

const JOURNAL_KEY = "__vfs_journal__";

export type JournalEntry =
    | {
        type: "create_file";
        inodeId: number;
        parent: number;
        name: string;
        dataKey: string;
    }
    | {
        type: "write_file";
        inodeId: number;
        size: number;
        mtime: number;
    };

export class Journal {
    private entries: JournalEntry[] = [];

    constructor(private driver: Driver) { }

    async load() {
        const raw = await this.driver.read(JOURNAL_KEY);
        if (raw) this.entries = deserialize(raw);
    }

    async append(entry: JournalEntry) {
        this.entries.push(entry);
        await this.flush();
    }

    async flush() {
        await this.driver.write(
            JOURNAL_KEY,
            serialize(this.entries)
        );
    }

    async clear() {
        this.entries = [];
        await this.driver.delete(JOURNAL_KEY);
    }

    getEntries() {
        return this.entries;
    }
}
