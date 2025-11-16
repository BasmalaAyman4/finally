import NotFound from '@/components/ui/NotFound/NotFound';

export default function ProductNotFound() {
    return (
        <NotFound
            title="Product Not Found"
            message="Sorry, we couldn't find the product you're looking for. It may have been removed or is temporarily unavailable."
            showBackButton={true}
        />
    );
}