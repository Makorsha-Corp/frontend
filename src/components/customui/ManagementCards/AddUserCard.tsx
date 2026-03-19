"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import * as z from "zod";
import { useState } from "react";
import { Plus, X } from "lucide-react";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.string().min(1, "Position is required"),
  permission: z.enum(["department", "finance", "admin", "directorTechnical"]),
  email: z.string().email("Invalid email"),
  password: z.string().min(5, "Password must be greater than 4 letters"),
});

type FormSchema = z.infer<typeof formSchema>;

const permissionOptions = [
  { label: "Department", value: "department" },
  { label: "Finance", value: "finance" },
  { label: "Admin", value: "admin" },
  { label: "Director (Technical)", value: "directorTechnical" },
];

const AddUserCard = () => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      position: "",
      email: "",
      password: "",
      permission: undefined,
    },
  });

  const [isCancelled, setIsCancelled] = useState(false);

  const handleCancel = () => {
    form.reset();
    setIsCancelled(true);
    toast("User creation cancelled.");
  };

  const onSubmit = (values: FormSchema) => {
    console.log(values);
    toast.success("User added successfully!");
    form.reset();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-8">Add User</h2>
      <div className="w-full max-w-3xl mx-auto">
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Position */}
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input placeholder="Position title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormDescription>Password must be greater than 4 letters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permission */}
            <FormField
              control={form.control}
              name="permission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permission</FormLabel>
                  <FormControl>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="">Select permission</option>
                      {permissionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>Select a user permission level</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="text-white bg-red-600 hover:bg-red-100"
                onClick={handleCancel}
              >
                <X className="mr-1" size={18} />
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="mr-1" size={18} />
                Add
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
    
  );
};

export default AddUserCard;
