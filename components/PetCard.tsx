"use client"
import { useRouter } from "next/navigation"

export default function PetCard(){
  const router = useRouter()
  return(
    <div className="card hoverCard" onClick={()=>router.push("/shop")}>
      <h3>Pet Shop</h3>
      <p>Buy pets</p>
    </div>
  )
}
