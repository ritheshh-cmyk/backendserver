import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface GroupedExpenditureFormProps {
  onSuccess?: () => void;
}

export default function GroupedExpenditureForm({ onSuccess }: GroupedExpenditureFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "monthly",
    amount: "",
    dueDate: "",
  });

  const addGroupedExpenditureMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/grouped-expenditures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add grouped expenditure");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grouped expenditure added successfully!",
      });
      setFormData({
        name: "",
        description: "",
        frequency: "monthly",
        amount: "",
        dueDate: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grouped-expenditures"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add grouped expenditure",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.amount.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and amount are required",
        variant: "destructive",
      });
      return;
    }
    addGroupedExpenditureMutation.mutate(formData);
  };

  return (
    <Card className="w-full max-w-md bg-card text-card-foreground">
      <CardHeader className="bg-background text-foreground">
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Grouped Expenditure
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Internet Provider"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={addGroupedExpenditureMutation.isPending}
          >
            {addGroupedExpenditureMutation.isPending ? "Adding..." : "Add Grouped Expenditure"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 