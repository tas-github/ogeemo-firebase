"use client"

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PersonStanding, ListTodo, WandSparkles, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateForm, type GenerateFormOutput } from "@/ai/flows/generate-form-flow";
import { Skeleton } from "@/components/ui/skeleton";


const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  notes: z.string().optional(),
});

const taskFormSchema = z.object({
  title: z.string().min(2, { message: "Task title must be at least 2 characters." }),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
});

type FormType = "contact" | "task";

function ContactForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", notes: "" },
  });

  function onSubmit(values: z.infer<typeof contactFormSchema>) {
    console.log("Contact form submitted:", values);
    toast({
      title: "Contact Saved",
      description: `Contact "${values.name}" has been successfully saved.`,
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <PersonStanding className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>New Contact Form</CardTitle>
              <CardDescription>
                Add a new contact to your database.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any relevant notes about this contact..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit">Save Contact</Button>
        </CardFooter>
      </form>
    </Form>
  );
}

function TaskForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { title: "", description: "", priority: "medium" },
  });

  function onSubmit(values: z.infer<typeof taskFormSchema>) {
    console.log("Task form submitted:", values);
    toast({
      title: "Task Saved",
      description: `Task "${values.title}" has been successfully saved.`,
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ListTodo className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>New Task Form</CardTitle>
              <CardDescription>
                Add a new task to your project list.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Finalize Q3 report" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide details about the task..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit">Save Task</Button>
        </CardFooter>
      </form>
    </Form>
  );
}

// New component to render the dynamically generated form
const GeneratedForm = ({ schema, onClear }: { schema: GenerateFormOutput, onClear: () => void }) => {
  const { toast } = useToast();
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    console.log("Generated Form Submitted:", data);
    toast({
      title: "Form Submitted (Prototype)",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  };

  return (
    <Card className="transition-all duration-300 animate-in fade-in-50">
        <form onSubmit={handleSubmit}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <WandSparkles className="h-6 w-6 text-primary" />
                    {schema.name}
                </CardTitle>
                <CardDescription>
                    This form was generated by AI. Submissions will be logged to the console.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {schema.fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>{field.label}</Label>
                        {field.type === 'textarea' ? (
                            <Textarea id={field.name} name={field.name} placeholder={`Enter ${field.label.toLowerCase()}...`} />
                        ) : field.type === 'select' ? (
                            <Select name={field.name}>
                                <SelectTrigger id={field.name}>
                                    <SelectValue placeholder={`Select a ${field.label.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {field.options?.map(option => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input id={field.name} name={field.name} type={field.type} placeholder={`Enter ${field.label.toLowerCase()}...`} />
                        )}
                    </div>
                ))}
            </CardContent>
            <CardFooter className="justify-between">
                <Button type="submit">Submit Generated Form</Button>
                <Button variant="ghost" onClick={onClear}>Clear Form</Button>
            </CardFooter>
        </form>
    </Card>
  )
}

export function FormsView() {
  const [formType, setFormType] = useState<FormType>("contact");
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [generationDescription, setGenerationDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchema, setGeneratedSchema] = useState<GenerateFormOutput | null>(null);
  const { toast } = useToast();

  const handleGenerateForm = async () => {
      if (!generationDescription.trim()) {
          toast({ variant: "destructive", title: "Description is required." });
          return;
      }
      setIsGenerating(true);
      try {
          const schema = await generateForm({ description: generationDescription });
          setGeneratedSchema(schema);
          setIsGenerateDialogOpen(false);
          setGenerationDescription("");
      } catch (error: any) {
          console.error("Form generation failed:", error);
          toast({ variant: "destructive", title: "Generation Failed", description: error.message });
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <>
      <div className="space-y-6 p-4 sm:p-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">
            Form Generation Manager
          </h1>
          <p className="text-muted-foreground">
            Use dynamically generated forms to add data to your collections.
          </p>
        </header>
        
        <div className="max-w-2xl mx-auto space-y-8">
           <Card>
             <CardHeader>
                <CardTitle>Form Library</CardTitle>
                <CardDescription>Select a standard form or generate a new one using AI.</CardDescription>
             </CardHeader>
             <CardContent className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="form-type-select">Standard Forms</Label>
                  <Select value={formType} onValueChange={(value: FormType) => setFormType(value)}>
                    <SelectTrigger id="form-type-select" className="mt-2">
                      <SelectValue placeholder="Choose a form to display..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contact">New Contact</SelectItem>
                      <SelectItem value="task">New Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col justify-end">
                    <Button variant="outline" onClick={() => setIsGenerateDialogOpen(true)} className="w-full">
                        <WandSparkles className="mr-2 h-4 w-4" />
                        Generate New Form
                    </Button>
                </div>
             </CardContent>
           </Card>

          {generatedSchema ? (
            <GeneratedForm schema={generatedSchema} onClear={() => setGeneratedSchema(null)} />
          ) : isGenerating ? (
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
             </Card>
          ) : (
            <Card key={formType} className="transition-all duration-300 animate-in fade-in-50">
              {formType === "contact" ? <ContactForm /> : <TaskForm />}
            </Card>
          )}

        </div>

      </div>
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Generate a New Form</DialogTitle>
                <DialogDescription>Describe the form you want to create. For example, "A form to collect customer feedback with fields for name, email, and a comments area."</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="form-description" className="sr-only">Form Description</Label>
                <Textarea
                    id="form-description"
                    placeholder="e.g., A form to track bugs with a title, description, and priority level."
                    rows={4}
                    value={generationDescription}
                    onChange={(e) => setGenerationDescription(e.target.value)}
                    disabled={isGenerating}
                />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsGenerateDialogOpen(false)} disabled={isGenerating}>Cancel</Button>
                <Button onClick={handleGenerateForm} disabled={isGenerating}>
                    {isGenerating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                    {isGenerating ? "Generating..." : "Generate"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
