import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Coins } from "lucide-react"

interface GasFeeInfoProps {
    itemPrice: number // Price in OCT
    showTitle?: boolean
}

export function GasFeeInfo({ itemPrice, showTitle = true }: GasFeeInfoProps) {
    const platformFee = itemPrice * 0.05 // 5% from Marketplace.move (PLATFORM_FEE_PERCENTAGE)
    const estimatedGas = 0.001 // Estimated gas in OCT
    const totalCost = itemPrice + platformFee + estimatedGas

    return (
        <Card className="border-cyan-500/30 bg-card/50 backdrop-blur">
            {showTitle && (
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <Coins className="h-4 w-4 text-cyan-400" />
                        Transaction Breakdown
                    </CardTitle>
                </CardHeader>
            )}
            <CardContent className={showTitle ? "space-y-2" : "space-y-2 p-4"}>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Item Price:</span>
                    <span className="font-mono text-cyan-400">{itemPrice.toFixed(3)} OCT</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee (5%):</span>
                    <span className="font-mono text-orange-400">{platformFee.toFixed(3)} OCT</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Gas:</span>
                    <span className="font-mono text-cyan-400">{estimatedGas.toFixed(3)} OCT</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between text-base font-bold">
                    <span>Total Cost:</span>
                    <span className="text-cyan-400 font-mono">{totalCost.toFixed(3)} OCT</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground mt-3 p-2 rounded bg-blue-950/20 border border-blue-500/20">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-400" />
                    <p>
                        Gas fees are estimates. Actual cost may vary based on network congestion.
                        Platform fee goes to marketplace contract.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
