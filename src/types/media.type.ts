import { MediaType } from "express";

export interface MediaModel {
  key: string;
  content_type: string;
  actor_id: string;
  type?: MediaType;
  name?: string;
}
