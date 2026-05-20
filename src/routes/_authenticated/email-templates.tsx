import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  type EmailTemplate,
  fetchEmailTemplates,
  saveEmailTemplate,
  updateDefaultEmailTemplate,
  deleteEmailTemplate,
} from "@/lib/user-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, Trash2, Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/email-templates")({
  component: EmailTemplatesPage,
  head: () => ({
    meta: [
      { title: "Email Templates — Lead Finder" },
      { name: "description", content: "Create and manage email templates for outreach." },
    ],
  }),
});

const DEFAULT_EMAIL_TEMPLATE: EmailTemplate = {
  id: "",
  name: "Welcome Email",
  subject: "Your [Business Name] Website is Ready 🚀",
  content: `Hi [Business Name] team,

I hope this message finds you well!

I recently discovered your business and noticed you don't have a website yet. In today's digital world, having a strong online presence is crucial for growth and customer trust.

I've actually gone ahead and created a professional website for your business that showcases your services beautifully.

Here's what it includes:
✓ Professional design tailored to your industry
✓ Mobile-responsive (works on all devices)
✓ Business information and contact details
✓ Gallery to showcase your work
✓ SEO-optimized for local search

Would you have 15 minutes this week to take a quick look? I'd love to show you how it can help attract more customers.

Best regards`,
  isDefault: false,
  createdAt: 0,
  updatedAt: 0,
};

function EmailTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(DEFAULT_EMAIL_TEMPLATE);

  useEffect(() => {
    if (!user) return;
    loadTemplates();
  }, [user]);

  const loadTemplates = async () => {
    if (!user) return;
    const data = await fetchEmailTemplates(user.uid);
    setTemplates(data);
  };

  const handleSubmit = async () => {
    if (!user || !formData.name.trim() || !formData.subject.trim() || !formData.content.trim()) {
      return;
    }

    const template: EmailTemplate = {
      ...formData,
      id: editingId || crypto.randomUUID(),
      createdAt: editingId ? formData.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    await saveEmailTemplate(user.uid, template);
    await loadTemplates();
    setShowForm(false);
    setEditingId(null);
    setFormData(DEFAULT_EMAIL_TEMPLATE);
  };

  const handleEdit = (template: EmailTemplate) => {
    setFormData(template);
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!user || !confirm("Delete this template?")) return;
    await deleteEmailTemplate(user.uid, templateId);
    await loadTemplates();
  };

  const handleSetDefault = async (templateId: string) => {
    if (!user) return;
    await updateDefaultEmailTemplate(user.uid, templateId);
    await loadTemplates();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(DEFAULT_EMAIL_TEMPLATE);
  };

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-8 lg:py-12 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-12 animate-rise flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Templates</p>
          <h1 className="mt-2 font-display text-[2.25rem] sm:text-5xl text-foreground leading-[0.95]">
            Email Templates
          </h1>
        </div>
        {!showForm && (
          <Button
            onClick={() => {
              setFormData(DEFAULT_EMAIL_TEMPLATE);
              setEditingId(null);
              setShowForm(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 animate-rise rounded-2xl border border-border/40 bg-card p-6 lg:p-8">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            {editingId ? "Edit Template" : "Create New Template"}
          </h2>

          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Template Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Welcome Email"
                className="mt-2 h-10"
              />
            </div>

            <div>
              <Label htmlFor="subject" className="text-sm font-medium">
                Email Subject
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Your [Business Name] Website is Ready 🚀"
                className="mt-2 h-10"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Use [Business Name] as a placeholder
              </p>
            </div>

            <div>
              <Label htmlFor="content" className="text-sm font-medium">
                Email Content
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Your email template..."
                className="mt-2 h-64 resize-none font-mono text-sm"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Use [Business Name] to insert the business name dynamically
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSubmit} className="gap-2">
                <Check className="h-4 w-4" />
                Save Template
              </Button>
              <Button onClick={handleCancel} variant="outline" className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="animate-rise grid gap-4">
        {templates.length === 0 ? (
          <div className="rounded-2xl border border-border/40 bg-card p-12 text-center">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No email templates yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first template to get started
            </p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="rounded-2xl border border-border/40 bg-card p-6 hover:border-border/60 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                    {template.isDefault && (
                      <Badge className="bg-green-100 text-green-800">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{template.subject}</p>
                </div>
              </div>

              <div className="mb-4 p-4 rounded-lg bg-muted/30 max-h-40 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap font-mono">
                  {template.content.substring(0, 200)}
                  {template.content.length > 200 && "..."}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(template)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  Edit
                </Button>
                {!template.isDefault && (
                  <Button onClick={() => handleSetDefault(template.id)} variant="outline" size="sm">
                    Set as Default
                  </Button>
                )}
                <Button
                  onClick={() => handleDelete(template.id)}
                  variant="destructive"
                  size="sm"
                  className="gap-2 ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
