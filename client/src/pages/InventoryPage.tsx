import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import InventoryManager from "@/components/InventoryManager";

export default function InventoryPage() {
  const handleExportExcel = async () => {
    try {
      const response = await fetch("/api/export/excel");
      if (!response.ok) throw new Error("Failed to export data");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-business-light dark:bg-background">
      <MobileHeader onExport={handleExportExcel} />
      
      <div className="flex h-screen lg:h-auto">
        <Sidebar onExport={handleExportExcel} />
        
        <main className="flex-1 lg:ml-0 min-h-screen bg-business-light dark:bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <InventoryManager />
          </div>
        </main>
      </div>
    </div>
  );
}