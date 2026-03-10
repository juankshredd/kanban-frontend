"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function CreateTaskModal({ status, close, refresh }: any) {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    await api("/tasks", "POST", {
      title,
      description,
      status,
    });

    refresh();
    close();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-96">

        <h2 className="text-xl font-bold mb-4 dark:text-white">
          Create Task
        </h2>

        <input
          placeholder="Title"
          className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white w-full mb-3 p-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description"
          className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white w-full mb-3 p-2 rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex justify-end gap-2">

          <button
            onClick={close}
            className="px-3 py-1 border border-gray-300 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 rounded hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            className="px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition"
          >
            Create
          </button>

        </div>

      </div>

    </div>
  );
}