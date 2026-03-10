"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const res = await api("/auth/login", "POST", {
        email,
        password,
      });

      localStorage.setItem("token", res.token);

      router.push("/dashboard");
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">

      <div className="bg-white w-[420px] p-10 rounded-2xl shadow-2xl">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="text-3xl font-extrabold text-gray-800">
            Hack-Balí
          </div>

          <div className="text-gray-500 text-sm">
            Kanban App
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-6">
          Sign in
        </h2>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Button */}
        <button
          onClick={login}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Login
        </button>

        {/* Register */}
        <div className="text-center mt-6 text-sm text-gray-500">
          Don’t have an account?
        </div>

        <button
          onClick={() => router.push("/register")}
          className="w-full mt-2 border border-gray-300 py-2 rounded-lg hover:bg-gray-100"
        >
          Create account
        </button>

      </div>

    </div>
  );
}