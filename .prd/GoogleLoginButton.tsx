import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Ajuste o caminho se necessário

export function GoogleLoginButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Redireciona de volta para a aplicação após o login no Google.
                    // Você pode mudar '/dashboard' para a rota que faz o roteamento baseado na role.
                    redirectTo: `${window.location.origin}/dashboard`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) {
                throw error;
            }

            // O redirecionamento acontece automaticamente pelo Supabase
        } catch (err: any) {
            console.error('Erro ao fazer login com Google:', err.message);
            setError('Ocorreu um erro ao tentar entrar com o Google. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? (
                    <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                )}
                <span>Entrar com Google</span>
            </button>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        </div>
    );
}