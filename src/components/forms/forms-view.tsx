"use client"

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PersonStanding, ListTodo } from "lucide-react";

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


export function FormsView() {
  const [formType, setFormType] = useState<FormType>("contact");

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Form Generation Manager
        </h1>
        <p className="text-muted-foreground">
          Use dynamically generated forms to add data to your collections.
        </p>
      </header>
      
      <div className="max-w-2xl mx-auto">
         <div className="mb-6">
          <Label htmlFor="form-type-select">Select Form Type</Label>
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

        <Card key={formType} className="transition-all duration-300 animate-in fade-in-50">
          {formType === "contact" ? <ContactForm /> : <TaskForm />}
        </Card>
      </div>

    </div>
  );
}
