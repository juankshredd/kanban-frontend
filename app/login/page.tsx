"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Image from "next/image";

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
    <>
      {/* Theme toggle — fuera del contenedor overflow-hidden para que fixed funcione bien */}
      <div className="fixed top-5 right-8 z-50">
        <ThemeToggle />
      </div>

    <div className="relative min-h-screen flex items-end justify-center pb-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors overflow-hidden">

      {/* Logo de fondo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
        <Image
          src="/logo.png"
          alt=""
          width={520}
          height={520}
          className="opacity-25 dark:opacity-20 object-contain"
          priority
        />
      </div>

      {/* Card */}
      <div className="relative z-10 bg-white dark:bg-slate-800 w-[420px] p-10 rounded-2xl shadow-2xl">

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">
          Sign in
        </h2>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Button */}
        <button
          onClick={login}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Login
        </button>

        {/* Register */}
        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?
        </div>

        <button
          onClick={() => router.push("/register")}
          className="w-full mt-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 py-2 rounded-lg hover:bg-gray-100 transition"
        >
          Create account
        </button>

      </div>

    </div>
    </>
  );
}
