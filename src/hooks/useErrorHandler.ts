import { useCallback } from 'react';
import { toast } from 'sonner';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  customMessage?: string;
  logError?: boolean;
  onError?: (error: Error) => void;
}

export const useErrorHandler = () => {
  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      customMessage,
      logError = true,
      onError
    } = options;

    // Garantir que temos um objeto Error
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Log do erro
    if (logError) {
      console.error('Error handled:', errorObj);
    }

    // Mostrar toast se solicitado
    if (showToast) {
      const message = customMessage || getErrorMessage(errorObj);
      toast.error(message);
    }

    // Callback personalizado
    if (onError) {
      onError(errorObj);
    }

    return errorObj;
  }, []);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, options);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
};

function getErrorMessage(error: Error): string {
  // Mensagens específicas para erros conhecidos
  if (error.message.includes('not authenticated')) {
    return 'Você precisa estar logado para realizar esta ação';
  }
  
  if (error.message.includes('permission denied')) {
    return 'Você não tem permissão para realizar esta ação';
  }
  
  if (error.message.includes('network')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente';
  }
  
  if (error.message.includes('timeout')) {
    return 'A operação demorou muito para responder. Tente novamente';
  }

  // Mensagem padrão para outros erros
  return error.message || 'Ocorreu um erro inesperado';
}