'use client'

import React from "react";
import { SparklesIcon } from "@/shared/ui/Icon";

export default function PlaygroundPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary rounded-3xl blur-xl opacity-50 scale-110 animate-pulse-slow"></div>
        <div className="relative w-20 h-20 bg-primary/80 backdrop-blur-md rounded-3xl flex items-center justify-center rotate-3 shadow-lg shadow-primary/30 border border-card/40">
          <SparklesIcon className="w-8 h-8 text-primary-foreground" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-foreground mb-4">Playground</h1>
      <p className="text-muted-foreground text-center max-w-md">
        这是 Playground 页面，用于测试和调试 L-Core 的纯函数能力。
      </p>
      
      <div className="mt-8 p-6 glass rounded-2xl max-w-lg w-full">
        <h2 className="text-lg font-semibold text-foreground mb-4">可用的 Core 函数</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <code className="text-sm bg-muted px-2 py-1 rounded">runChat(input, ctx)</code>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted"></span>
            <code className="text-sm bg-muted px-2 py-1 rounded">runProject(input, ctx)</code>
            <span className="text-xs text-muted-foreground">(待实现)</span>
          </li>
        </ul>
      </div>
    </div>
  );
};



