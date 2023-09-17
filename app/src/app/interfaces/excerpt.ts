export interface Excerpt {
    id: string,
    text: string,
    full_context?: string,
    document_id?: string,
    dataset_id?: string,
    offset_start?: number,
    offset_end?: number,
}