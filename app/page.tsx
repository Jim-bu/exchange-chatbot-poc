import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <main className="h-dvh w-full flex items-center justify-center bg-white sm:bg-gray-100">
      <div className="
        relative flex flex-col overflow-hidden bg-white
        w-full h-full
        sm:w-[390px] sm:h-auto sm:min-h-0
        sm:max-h-[calc(100dvh-48px)]
        sm:rounded-[44px]
        sm:shadow-[0_32px_80px_rgba(0,0,0,0.18)]
        sm:border sm:border-gray-200
      ">
        <ChatWidget />
      </div>
    </main>
  );
}
