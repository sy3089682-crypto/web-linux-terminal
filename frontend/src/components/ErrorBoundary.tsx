import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8 text-white">
                    <div className="text-center max-w-md">
                        <AlertTriangle size={48} className="mx-auto mb-6 text-red-500" />
                        <h1 className="text-2xl font-black mb-2">Something crashed</h1>
                        <p className="text-gray-500 text-sm mb-6">{this.state.error?.message}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-all"
                        >
                            Reload
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
