import type { ReactNode } from 'react';

export function CartRow({
  name,
  quantity,
  action,
}: {
  readonly name: string;
  readonly quantity: ReactNode;
  readonly action: ReactNode;
}) {
  return (
    <li className="cart-row">
      <div className="cart-item-identity">
        <span className="cart-item-name">{name}</span>
      </div>
      <div className="cart-quantity">{quantity}</div>
      <div className="cart-action">{action}</div>
    </li>
  );
}
