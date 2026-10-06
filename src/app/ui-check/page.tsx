"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Temporary page for task 1.2, removed once real screens exist.
export default function UiCheckPage() {
  return (
    <main className="mx-auto w-full max-w-[1280px] space-y-8 px-6 py-12">
      <h1 className="text-3xl font-semibold">Theme check</h1>

      <div className="flex flex-wrap items-center gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
        <Button variant="secondary" onClick={() => toast.success("Asset published")}>
          Show toast
        </Button>
      </div>

      <div className="max-w-sm rounded-xl border bg-surface p-6">
        <p className="text-lg font-semibold">Bank in Poland</p>
        <p className="mt-1 text-sm text-text-muted">Asking price</p>
        <div className="mt-2 rounded-lg bg-primary-soft px-4 py-3 text-lg font-semibold tabular-nums text-primary">
          EUR 12,500,000
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Validated</Badge>
          <Badge variant="warning">Suspended</Badge>
          <Badge variant="destructive">Removed</Badge>
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="name@company.com" />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
        </TabsList>
      </Tabs>
    </main>
  );
}
