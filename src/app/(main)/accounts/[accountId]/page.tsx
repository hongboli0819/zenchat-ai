import AccountDetailPage from "@/app/pages/AccountDetailPage";

export default function AccountDetail({
  params,
}: {
  params: { accountId: string };
}) {
  return <AccountDetailPage />;
}
