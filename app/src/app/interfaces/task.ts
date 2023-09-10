export interface Task {
    id: string,
    dataset_id: string,
    name: string,
    type: string,
    level: string,
    redundant?: string,
    guideline?: string,
}