export interface Task {
    id: string,
    dataset_id: string,
    name: string,
    type: string,
    level: string,
    redundant?: string,
    guideline?: string,
    dataset_name?: string,
    is_completed?: number,
    in_progress?: number,
    assigned?: string,
    nb_completed_excerpts: number,
    nb_completed_documents?: number,
    nb_documents?: number,
    nb_excerpts?: number,
    status?: string,
}

