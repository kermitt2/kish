import { Task } from './task';

export interface Dataset {
    id: string,
    name: string,
    description?: string,
    image_url: string,
    nb_documents?: number,
    nb_excerpts?: number,
    nb_tasks?: number,
    tasks?: Task[]
}