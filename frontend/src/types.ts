export interface User {
    id: string;
    username: string;
    avatar?: string;
}

export interface Instance {
    _id: string;
    userId: string;
    name: string;
    image: string;
    slug: string;
    template: 'blank' | 'nodejs' | 'python' | 'react' | 'desktop';
    containerId?: string;
    port?: number;
    status: 'running' | 'stopped';
    sharedTokens?: { token: string; expiresAt: string; access: 'read' | 'write' }[];
    createdAt: string;
}

export interface FileItem {
    name: string;
    isDirectory: boolean;
    path: string;
}

export interface AIMessage {
    role: 'user' | 'ai';
    text: string;
}

export interface Template {
    id: string;
    name: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    desc: string;
}

export interface Org {
    _id: string;
    name: string;
    slug: string;
    ownerId: string;
    members: { userId: { _id: string; username: string; avatar?: string }; role: string; joinedAt: string }[];
    plan: string;
    customDomain?: string;
    settings: { maxInstances: number; maxMemoryPerInstance: number; ssoEnabled: boolean };
}

export interface Subscription {
    _id: string;
    userId?: string;
    orgId?: string;
    plan: 'free' | 'pro' | 'enterprise';
    status: string;
    currentPeriodEnd?: string;
    features: {
        maxInstances: number;
        maxMemoryMb: number;
        maxStorageGb: number;
        maxTeamMembers: number;
        customDomain: boolean;
        sso: boolean;
        prioritySupport: boolean;
        aiAgent: boolean;
        versionHistory: boolean;
    };
}

export interface MarketTemplate {
    _id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    image: string;
    authorName: string;
    isOfficial: boolean;
    downloads: number;
    stars: number;
    setupScript: string;
    tags: string[];
}

export interface Version {
    _id: string;
    instanceId: string;
    filePath: string;
    content: string;
    size: number;
    hash: string;
    action: string;
    description?: string;
    createdAt: string;
}

export interface AIContext {
    task: string;
    cwd?: string;
    files?: { path: string; content: string }[];
    commandHistory?: string[];
}

export interface AIAgentResponse {
    type: 'command' | 'write' | 'read' | 'response' | 'multi';
    cmd?: string;
    path?: string;
    content?: string;
    text?: string;
    steps?: AIAgentResponse[];
}
