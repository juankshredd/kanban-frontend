"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api("/auth/register", "POST", form);

      alert("User created successfully");
      router.push("/login");
    } catch (error) {
      alert("Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            required
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
            className="w-full border p-2 rounded"
          />

          <input
            type="email"
            placeholder="Email"
            required
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="w-full border p-2 rounded"
          />

          <input
            type="password"
            placeholder="Password"
            required
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className="w-full border p-2 rounded"
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            Register
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/login")}
            className="text-blue-600 hover:underline text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}