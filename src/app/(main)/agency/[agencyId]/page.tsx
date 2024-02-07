export default function Page({ params }: { params: { agencyId: string } }) {
	return <div>{params.agencyId}</div>
}
