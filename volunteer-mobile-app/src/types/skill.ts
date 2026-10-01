export interface Skill {
  id: string;
  name: string;
  completed: boolean;
  signedOffBy?: string | null;
  signedOffAt?: string | null;
}
