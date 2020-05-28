import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const productFounded = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return productFounded;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const listIDs = products.map(product => product.id);

    const listOrders = await this.ormRepository.find({ id: In(listIDs) });

    if (listIDs.length !== listOrders.length) {
      throw new AppError('Missing some product');
    }

    return listOrders;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsData = await this.findAllById(products);

    const newProducts = productsData.map(productData => {
      const productFind = products.find(
        product => product.id === productData.id,
      );

      if (!productFind) {
        throw new AppError('Product not found');
      }

      const newProduct = productData;

      if (newProduct.quantity < productFind.quantity) {
        throw new AppError('Wrong product quantity');
      }

      newProduct.quantity -= productFind.quantity;

      return newProduct;
    });

    await this.ormRepository.save(newProducts);

    return newProducts;
  }
}

export default ProductsRepository;
