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

      <div className="bg-white rounded-lg p-6 w-96">

        <h2 className="text-xl font-bold mb-4">
          Create Task
        </h2>

        <input
          placeholder="Title"
          className="border w-full mb-3 p-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description"
          className="border w-full mb-3 p-2 rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex justify-end gap-2">

          <button
            onClick={close}
            className="px-3 py-1 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Create
          </button>

        </div>

      </div>

    </div>
  );
}