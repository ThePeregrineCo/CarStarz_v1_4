import { ClientOnly } from "~~/components/ClientOnly";
import { MintWithConfirmation } from "~~/components/MintWithConfirmation";

export default function MintPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Mint Your Vehicle NFT</h1>
      <ClientOnly
        fallback={
          <div className="flex items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-2">Loading mint form...</span>
          </div>
        }
      >
        <MintWithConfirmation />
      </ClientOnly>
    </div>
  );
}