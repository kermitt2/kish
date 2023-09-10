export interface Annotation {
    id: string,
    task_id: string,
    excerpt_id: string,
    user_id?: string,
    label_id?: string,
    original_id?: string,
    offset_start?: number,
    offset_end?: number,
    source?: string,
    value?: boolean,
    score: number,
    chunk: string,
    date: string,
    type: string,
    ignored: boolean,
    comment: string, 
    curated: boolean
}