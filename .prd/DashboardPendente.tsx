import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
// Assumindo o uso de lucide-react (padrão com Shadcn UI) para os ícones
import { Clock, PlayCircle, LogOut, Info } from 'lucide-react';

export function DashboardPendente() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState<string>('');

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Pega o nome vindo do Google Auth ou do e-mail
                const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];
                setUserName(name || 'Aluno');
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login'); // Ajuste para a sua rota de login
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

                {/* Cabeçalho */}
                <div className="bg-blue-600 px-8 py-10 text-center">
                    <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Olá, {userName}! Bem-vindo(a) ao ITEC.
                    </h1>
                    <p className="text-blue-100">
                        Sua conta foi criada com sucesso e está em fase de análise.
                    </p>
                </div>

                {/* Conteúdo */}
                <div className="p-8 space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-4">
                        <Info className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-amber-900">Aguardando Liberação da Secretaria</h3>
                            <p className="text-amber-700 text-sm mt-1">
                                Nossa equipe está verificando seus dados e a confirmação de matrícula.
                                Assim que o processo for concluído, seu acesso completo aos módulos e disciplinas será liberado automaticamente.
                            </p>
                        </div>
                    </div>

                    {/* Módulo Degustação */}
                    {/* Funcionalidade adiada para o futuro (registrada no PRD)
                    <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Comece a estudar agora!</h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    Enquanto aguarda, que tal assistir a nossa aula inaugural de introdução à Teologia?
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/degustacao')} // Ajuste para a rota da aula trial
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto justify-center whitespace-nowrap"
                            >
                                <PlayCircle className="w-5 h-5" />
                                Assistir Aula Trial
                            </button>
                        </div>
                    </div>
                    */}
                </div>

                {/* Rodapé */}
                <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                        Precisa de ajuda? <a href="#" className="text-blue-600 hover:underline">Fale com o suporte</a>
                    </p>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </div>

            </div>
        </div>
    );
}