export interface ApiResponse<T = undefined> {
  status: 'success' | 'fail' | 'error';
  message?: string;
  data?: T;
}

// Adicionar paginação depois
