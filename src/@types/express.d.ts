declare namespace Express {
  export interface Request {
    user: {
      id: number;
      tipo?: string;
    };
  }
}