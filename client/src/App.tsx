
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Product, CreateProductInput, Marketplace, ProductType, Brand } from '../../server/src/schema';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  // Form state
  const [formData, setFormData] = useState<CreateProductInput>({
    asin: '',
    marketplace_id: 1,
    product_type_id: undefined,
    brand_id: undefined,
    title: undefined,
    description_text: undefined,
    price: undefined,
    currency_code: 'USD',
    rating: undefined,
    reviews_count: undefined,
    bsr: undefined,
    bsr_30_days_avg: undefined,
    bullet_points: undefined,
    images: undefined,
    product_url: undefined,
    published_at: undefined,
    discovery_query: undefined,
    source_type: 'scraper',
    raw_data: undefined
  });

  // Filter state
  const [filters, setFilters] = useState({
    marketplace_id: undefined as number | undefined,
    product_type_id: undefined as number | undefined,
    brand_id: undefined as number | undefined,
    limit: 20,
    offset: 0
  });

  const loadData = useCallback(async () => {
    try {
      const [productsResult, marketplacesResult, productTypesResult, brandsResult] = await Promise.all([
        trpc.getProducts.query(filters),
        trpc.getMarketplaces.query(),
        trpc.getProductTypes.query(),
        trpc.getBrands.query()
      ]);
      
      setProducts(productsResult);
      setMarketplaces(marketplacesResult);
      setProductTypes(productTypesResult);
      setBrands(brandsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createProduct.mutate(formData);
      setProducts((prev: Product[]) => [response, ...prev]);
      // Reset form
      setFormData({
        asin: '',
        marketplace_id: 1,
        product_type_id: undefined,
        brand_id: undefined,
        title: undefined,
        description_text: undefined,
        price: undefined,
        currency_code: 'USD',
        rating: undefined,
        reviews_count: undefined,
        bsr: undefined,
        bsr_30_days_avg: undefined,
        bullet_points: undefined,
        images: undefined,
        product_url: undefined,
        published_at: undefined,
        discovery_query: undefined,
        source_type: 'scraper',
        raw_data: undefined
      });
    } catch (error) {
      console.error('Failed to create product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMarketplaceName = (id: number) => {
    return marketplaces.find(m => m.id === id)?.name || 'Unknown';
  };

  const getProductTypeName = (id: number | null) => {
    if (!id) return null;
    return productTypes.find(pt => pt.id === id)?.name || 'Unknown';
  };

  const getBrandName = (id: number | null) => {
    if (!id) return null;
    return brands.find(b => b.id === id)?.name || 'Unknown';
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return 'N/A';
    const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '';
    return `${symbol}${price.toFixed(2)}`;
  };

  const formatRating = (rating: number | null) => {
    if (!rating) return 'N/A';
    return `⭐ ${rating.toFixed(1)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🛍️ Amazon Marketplace Manager</h1>
          <p className="text-lg text-gray-600">Track and manage products across multiple Amazon marketplaces</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">📦 Product Catalog</TabsTrigger>
            <TabsTrigger value="add-product">➕ Add Product</TabsTrigger>
          </TabsList>

          <TabsContent value="add-product" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🆕 Add New Product</CardTitle>
                <CardDescription>
                  Add a new product to track across Amazon marketplaces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">ASIN *</label>
                      <Input
                        placeholder="B08N5WRWNW"
                        value={formData.asin}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateProductInput) => ({ ...prev, asin: e.target.value }))
                        }
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Marketplace *</label>
                      <Select 
                        value={formData.marketplace_id.toString()} 
                        onValueChange={(value: string) =>
                          setFormData((prev: CreateProductInput) => ({ ...prev, marketplace_id: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {marketplaces.map((marketplace: Marketplace) => (
                            <SelectItem key={marketplace.id} value={marketplace.id.toString()}>
                              {marketplace.code} - {marketplace.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Product Type</label>
                      <Select 
                        value={formData.product_type_id?.toString() || ''} 
                        onValueChange={(value: string) =>
                          setFormData((prev: CreateProductInput) => ({ 
                            ...prev, 
                            product_type_id: value ? parseInt(value) : undefined 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product type" />
                        </SelectTrigger>
                        <SelectContent>
                          {productTypes.map((type: ProductType) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Brand</label>
                      <Select 
                        value={formData.brand_id?.toString() || ''} 
                        onValueChange={(value: string) =>
                          setFormData((prev: CreateProductInput) => ({ 
                            ...prev, 
                            brand_id: value ? parseInt(value) : undefined 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((brand: Brand) => (
                            <SelectItem key={brand.id} value={brand.id.toString()}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <Input
                        placeholder="Product title"
                        value={formData.title || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateProductInput) => ({ 
                            ...prev, 
                            title: e.target.value || undefined 
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Price</label>
                      <Input
                        type="number"
                        placeholder="19.99"
                        step="0.01"
                        min="0"
                        value={formData.price || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateProductInput) => ({ 
                            ...prev, 
                            price: e.target.value ? parseFloat(e.target.value) : undefined 
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Currency</label>
                      <Select 
                        value={formData.currency_code} 
                        onValueChange={(value: string) =>
                          setFormData((prev: CreateProductInput) => ({ ...prev, currency_code: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">BSR</label>
                      <Input
                        type="number"
                        placeholder="12345"
                        min="1"
                        value={formData.bsr || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateProductInput) => ({ 
                            ...prev, 
                            bsr: e.target.value ? parseInt(e.target.value) : undefined 
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Rating</label>
                      <Input
                        type="number"
                        placeholder="4.5"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.rating || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateProductInput) => ({ 
                            ...prev, 
                            rating: e.target.value ? parseFloat(e.target.value) : undefined 
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? '🔄 Creating Product...' : '✨ Create Product'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>🔍 Filter Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Marketplace</label>
                    <Select 
                      value={filters.marketplace_id?.toString() || 'all'} 
                      onValueChange={(value: string) =>
                        setFilters((prev) => ({ 
                          ...prev, 
                          marketplace_id: value === 'all' ? undefined : parseInt(value),
                          offset: 0
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Marketplaces</SelectItem>
                        {marketplaces.map((marketplace: Marketplace) => (
                          <SelectItem key={marketplace.id} value={marketplace.id.toString()}>
                            {marketplace.code} - {marketplace.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Product Type</label>
                    <Select 
                      value={filters.product_type_id?.toString() || 'all'} 
                      onValueChange={(value: string) =>
                        setFilters((prev) => ({ 
                          ...prev, 
                          product_type_id: value === 'all' ? undefined : parseInt(value),
                          offset: 0
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {productTypes.map((type: ProductType) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Brand</label>
                    <Select 
                      value={filters.brand_id?.toString() || 'all'} 
                      onValueChange={(value: string) =>
                        setFilters((prev) => ({ 
                          ...prev, 
                          brand_id: value === 'all' ? undefined : parseInt(value),
                          offset: 0
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brands</SelectItem>
                        {brands.map((brand: Brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid gap-6">
              {products.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">
                      {Object.values(filters).some(v => v !== undefined && v !== 20 && v !== 0) 
                        ? 'Try adjusting your filters or add some products to get started.'
                        : 'Add your first product to start tracking!'}
                    </p>
                    <Button 
                      onClick={() => setActiveTab('add-product')}
                      className="mt-2"
                    >
                      ➕ Add First Product
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                products.map((product: Product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {product.title || `Product ${product.asin}`}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">ASIN: {product.asin}</Badge>
                            <Badge variant="outline">{getMarketplaceName(product.marketplace_id)}</Badge>
                            {getProductTypeName(product.product_type_id) && (
                              <Badge variant="outline">{getProductTypeName(product.product_type_id)}</Badge>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Price</p>
                          <p className="font-semibold text-lg">
                            {formatPrice(product.price, product.currency_code)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Rating</p>
                          <p className="font-semibold">
                            {formatRating(product.rating)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Reviews</p>
                          <p className="font-semibold">
                            {product.reviews_count?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">BSR</p>
                          <p className="font-semibold">
                            {product.bsr ? `#${product.bsr.toLocaleString()}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {getBrandName(product.brand_id) && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-500">Brand</p>
                          <Badge variant="secondary">{getBrandName(product.brand_id)}</Badge>
                        </div>
                      )}

                      {product.status && (
                        <div className="mt-3">
                          <Badge 
                            variant={product.status === 'active' ? 'default' : 'secondary'}
                          >
                            {product.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      )}

                      <div className="mt-4 text-xs text-gray-400">
                        Added: {product.created_at.toLocaleDateString()}
                        {product.first_seen_at && (
                          <> • First seen: {product.first_seen_at.toLocaleDateString()}</>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {products.length >= filters.limit && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={filters.offset === 0}
                  onClick={() => setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                >
                  ← Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                >
                  Next →
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
