'use client';

import * as React from 'react';

const TabsContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
} | null>(null);

const Tabs = ({ defaultValue, value: controlledValue, onValueChange, children, className }: any) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    
    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
    
    const handleValueChange = React.useCallback((newValue: string) => {
        if (controlledValue === undefined) {
            setUncontrolledValue(newValue);
        }
        if (onValueChange) {
            onValueChange(newValue);
        }
    }, [controlledValue, onValueChange]);

    return (
        <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
            <div className={className}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};

const TabsList = ({ children, className }: any) => (
    <div className={className}>
        {children}
    </div>
);

const TabsTrigger = ({ value, children, className }: any) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const isActive = context.value === value;

    return (
        <button
            onClick={() => context.onValueChange(value)}
            data-state={isActive ? 'active' : 'inactive'}
            className={`${className} ${isActive ? 'bg-white shadow-sm text-brand-blue-900' : 'text-slate-400'}`}
        >
            {children}
        </button>
    );
};

const TabsContent = ({ value: contentValue, children, className }: any) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    const isActive = contentValue === context.value;

    if (!isActive) return null;
    return (
        <div 
            data-state={isActive ? 'active' : 'inactive'} 
            className={`${className} animate-in fade-in duration-300`}
        >
            {children}
        </div>
    );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
