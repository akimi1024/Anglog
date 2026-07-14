import MapView from "@/components/MapView";

export default function MapPage() {
  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">地図</h1>
      <MapView />
    </main>
  );
}