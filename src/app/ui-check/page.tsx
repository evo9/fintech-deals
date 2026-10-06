"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
          <Badge variant="buyer">Buyer</Badge>
          <Badge variant="seller">Seller</Badge>
          <Badge variant="manager">Manager</Badge>
          <Badge variant="ink">Ink</Badge>
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="name@company.com" />
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="note">Message</Label>
          <Textarea id="note" placeholder="Write a message" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Select defaultValue="newest">
            <SelectTrigger aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price">Price: low to high</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Search" aria-label="Search" />
        </div>
      </div>

      <div className="flex max-w-sm items-center gap-4 rounded-xl border bg-surface p-6">
        <Skeleton className="h-12 w-20 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded-full" />
          <Skeleton className="h-4 w-1/2 rounded-full" />
        </div>
      </div>

      <Dialog>
        <DialogTrigger render={<Button variant="secondary">Open dialog</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove asset</DialogTitle>
            <DialogDescription>The seller will see the reason you enter here.</DialogDescription>
          </DialogHeader>
          <Textarea aria-label="Reason" placeholder="Reason" />
          <DialogFooter>
            <Button variant="ghost">Cancel</Button>
            <Button>Remove asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
        </TabsList>
      </Tabs>
    </main>
  );
}
