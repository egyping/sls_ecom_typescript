// { this is how the item record
//     "id": "e132ee4f-acad—4553-871f-6abf8c4d26a6",
//     "pk": "clothing",
//     "sk": "mens#jackets#e132ee4f—acad—4553-871f-6abf8c4d26a6",
//     "title": "Firewall Rain Jacket",
//     "brand": "RAB",
//     "description": "Lightweight rain jacket made for intrepid
//     "colour": "red",
//     "sizesAvailable": [
//     { "sizeCode": 1, "displayValue": "small" },
//     { "sizeCode": 2, "displayValue": "medium" },
//     { "sizeCode": 3, "displayValue": "large" }
//     ]
// }


type ProductId = string
type ProductGroup =  'clothing' | 'climbing' | 'cycling'
type Category = string
type Subcategory = string

export interface ProductsRecord {
    id: ProductId
    pk: ProductGroup
    sk: `${Category}#${Subcategory}#${ProductId}`
    title: string
    description: string
    colour: string
    sizesAvailable?: {
        sizeCode: number
        displayValue: string
    } []
}

type Timestamp = number;
export type OrderStatus = 'placed' | 'packed' | 'delivered' | 'error';

export interface OrderRecord {
  id: string;
  pk: string;
  sk: `order#${Timestamp}`;

  userId: string;
  userEmail: string;
  dateCreated: Timestamp;
  dateUpdated?: Timestamp;
  status: OrderStatus;
  items: { id: ProductId; count: number; size?: number }[];
}