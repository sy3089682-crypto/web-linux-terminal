import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Check, X, Zap, ChevronLeft, Shield, Crown } from 'lucide-react';
import type { Subscription } from '../types';

const PLANS = [
    { id: 'free', name: 'Free', price: 0, popular: false, icon: Zap, color: 'from-gray-500 to-gray-600',
        features: { maxInstances: 3, maxMemoryMb: 512, maxTeamMembers: 1, customDomain: false, sso: false, aiAgent: false, versionHistory: true } },
    { id: 'pro', name: 'Pro', price: 29, popular: true, icon: Crown, color: 'from-blue-500 to-indigo-600',
        features: { maxInstances: 20, maxMemoryMb: 4096, maxTeamMembers: 10, customDomain: true, sso: false, aiAgent: true, versionHistory: true } },
    { id: 'enterprise', name: 'Enterprise', price: 199, popular: false, icon: Shield, color: 'from-purple-500 to-pink-600',
        features: { maxInstances: 100, maxMemoryMb: 16384, maxTeamMembers: 100, customDomain: true, sso: true, aiAgent: true, versionHistory: true } },
];

const FEATURE_LABELS: Record<string, string> = {
    maxInstances: 'Max instances', maxMemoryMb: 'Memory per instance',
    maxTeamMembers: 'Team members', customDomain: 'Custom domains',
    sso: 'SSO / SAML', aiAgent: 'AI Agent', versionHistory: 'Version history',
};

export default function BillingPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/api/billing/subscription').then(r => setSubscription(r.data)).catch(() => {});
    }, []);

    const handleSubscribe = async (plan: string) => {
        try {
            const res = await api.post('/api/billing/subscribe', { plan });
            setSubscription(res.data);
        } catch (e) { console.error(e); }
    };

    const handleCancel = async () => {
        if (!confirm('Downgrade to Free plan?')) return;
        try {
            const res = await api.post('/api/billing/cancel', {});
            setSubscription(res.data);
        } catch (e) { console.error(e); }
    };

    const currentPlan = subscription?.plan || 'free';

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 sm:p-8 relative">
            <div className="fixed inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 pointer-events-none" />
            <div className="max-w-6xl mx-auto relative z-10">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-all">
                    <ChevronLeft size={16} /> Back
                </button>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Plans & Pricing</h1>
                    <p className="text-gray-500">Scale your cloud workspace. Cancel anytime.</p>
                    {subscription && (
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                            Current plan: <span className="font-bold text-white uppercase">{currentPlan}</span>
                            {currentPlan !== 'free' && (
                                <button onClick={handleCancel} className="text-red-500 hover:text-red-400 text-xs ml-2">Downgrade</button>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {PLANS.map(plan => {
                        const isCurrent = currentPlan === plan.id;
                        const Icon = plan.icon;
                        return (
                            <div key={plan.id} className={`relative bg-[#111] border rounded-3xl p-6 transition-all ${plan.popular ? 'border-blue-500/50 shadow-xl shadow-blue-600/10' : 'border-white/5'} ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
                                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Most Popular</div>}
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg`}>
                                    <Icon size={20} className="text-white" />
                                </div>
                                <h3 className="text-xl font-black text-white mb-1">{plan.name}</h3>
                                <div className="text-3xl font-black text-white mb-6">${plan.price}<span className="text-sm text-gray-600 font-medium">/mo</span></div>
                                <div className="space-y-3 mb-8">
                                    {Object.entries(plan.features).map(([key, val]) => (
                                        <div key={key} className="flex items-center gap-3 text-sm">
                                            {val ? <Check size={14} className="text-emerald-500 shrink-0" /> : <X size={14} className="text-gray-700 shrink-0" />}
                                            <span className={val ? 'text-gray-300' : 'text-gray-700'}>{FEATURE_LABELS[key] || key}</span>
                                            {typeof val === 'number' && <span className="ml-auto text-xs font-bold text-gray-500">{val}</span>}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => handleSubscribe(plan.id)}
                                    disabled={isCurrent}
                                    className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                                        isCurrent ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30' :
                                        plan.popular ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' :
                                        'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                                    }`}>
                                    {isCurrent ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : 'Subscribe'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
                    <h2 className="text-lg font-black text-white mb-4">Plan Details</h2>
                    <div className="text-sm text-gray-500 space-y-2">
                        <p>• All plans include: Web terminal, Monaco editor, file manager, PWA support, real-time collaboration</p>
                        <p>• Pro adds: AI Agent, 4GB RAM, custom domains, 10 team members, priority support</p>
                        <p>• Enterprise adds: SSO/SAML, 16GB RAM, 100 team members, dedicated support, audit logs</p>
                        <p>• All prices in USD. Billed monthly. Cancel anytime — no contracts.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
