import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo.png"
        alt="Hack-Balí logo"
        width={40}
        height={40}
        className="rounded-lg object-contain"
      />
      <div>
        <div className="font-bold text-lg">Hack-Balí</div>
        <div className="text-xs text-gray-500">Kanban App</div>
      </div>
    </div>
  );
}
