import { Navigate, Route, Routes } from "react-router"
import { ProductBrowser } from "@/components/product-browser"

function App() {
  return (
    <Routes>
      <Route path="/" element={<ProductBrowser />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
