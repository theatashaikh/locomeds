const nodeMailer = require("nodemailer");
const capitalizeFirstLetter = require("./capitalizeFirstLetter");

const transporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_APP_EMAIL_FOR_NODEMAILER,
    pass: process.env.GOOGLE_APP_PASSWORD_FOR_NODEMAILER,
  },
});

function sendEmailToVendorForNewOrder(vendor, order, user) {
  const vendorMailOptions = {
    from: process.env.GOOGLE_APP_EMAIL_FOR_NODEMAILER,
    to: vendor.email,
    subject: "New Order Received",
    html: ` 
    Dear <b>${capitalizeFirstLetter(vendor.firstName)}</b>,<br><br> 
    You have received a new order from <b>${capitalizeFirstLetter(
      user.firstName
    )} ${capitalizeFirstLetter(
      user.lastName
    )}</b>. Please find the order details below:<br><br> 
    <b>Order ID:</b> ${order._id}<br>

    <b>Items:</b><br> 
    <table border="1" cellpadding="5" cellspacing="0" bordercolor="#dddddd">
    <thead>
    <tr>
    <th>Sr no.</th><th>Product Name</th><th>Quantity</th><th>Price</th><th>Total</th>
    </tr> 
    </thead> 
    <tbody> 
    ${order.items
      .map(
        (item, idx) =>
          ` <tr><td>${idx + 1}</td><td>${item.product.name}</td> <td>${
            item.quantity
          }</td><td>${item.product.price}</td><td>${
            item.product.price * item.quantity
          }</td> </tr>`
      )
      .join("")} 
      <tr>
        <td colspan="4"><b>Total</b></td>
        <td><b>₹${order.totalAmount}</b></td>
      </tr>
    </tbody>
    </table><br><br>

    <b>Amount:</b> ₹${order.totalAmount},<br>
    <b>Discount:</b> ${order.discountPercentage}%,<br>
    <b>Amount after discount:</b> ₹${order.totalAmountAfterDiscount},<br>
    <b>Delivery charge:</b> ₹${order.deliveryCharge},<br>
    <h2>Total: ₹${
      order.totalAmountAfterDiscount + order.deliveryCharge
    },</h2><br>
    <b>Shipping Address:</b> ${order.shippingAddress.addressLine}, ${
      order.shippingAddress.city
    },
    ${order.shippingAddress.district}, ${order.shippingAddress.state} - ${
      order.shippingAddress.pincode
    }<br><br>
    <b>Contact Number:</b> ${order.userContactNumber}<br><br>
    Please process this order at your earliest convenience.<br><br> 
    Best regards,<br> 
    <b>Locomeds</b>`,
  };

  transporter.sendMail(vendorMailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email to vendor:", error);
    } else {
      console.log("Email sent to vendor:", info.response);
    }
  });
}

function sendEmailToUserForOrderConfirmation(user, order) {
  const userMailOptions = {
    from: process.env.GOOGLE_APP_EMAIL_FOR_NODEMAILER,
    to: user.email,
    subject: "Order Confirmation",
    html: `
        Dear <b>${capitalizeFirstLetter(user.firstName)}</b>,,<br><br>

        Your order has been placed successfully. Please find the order details below:</b>,<br><br>

        <b>Order ID:</b> ${order._id},<br>
        <b>Items:</b><br> 
        <table border="1" cellpadding="5" cellspacing="0" bordercolor="#dddddd">
        <thead>
        <tr>
        <th>Sr no.</th><th>Product Name</th><th>Quantity</th><th>Price</th><th>Total</th>
        </tr> 
        </thead> 
        <tbody> 
        ${order.items
          .map(
            (item, idx) =>
              ` <tr><td>${idx + 1}</td><td>${item.product.name}</td> <td>${
                item.quantity
              }</td><td>${item.product.price}</td><td>${
                item.product.price * item.quantity
              }</td> </tr>`
          )
          .join("")} 
          <tr>
            <td colspan="4"><b>Total</b></td>
            <td><b>₹${order.totalAmount}</b></td>
        </tr>
        </tbody>
        </table><br><br>
        <b>Amount:</b> ₹${order.totalAmount},<br>
        <b>Discount:</b> ${order.discountPercentage}%,<br>
        <b>Amount after discount:</b> ₹${order.totalAmountAfterDiscount},<br>
        <b>Delivery charge:</b> ₹${order.deliveryCharge},<br>
        <h2>Total: ₹${
          order.totalAmountAfterDiscount + order.deliveryCharge
        },</h2><br>
        <b>Shipping Address:</b> ${order.shippingAddress.addressLine}, ${
      order.shippingAddress.district
    }, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${
      order.shippingAddress.pincode
    },<br>
        <b>Contact Number:</b> ${order.userContactNumber},<br><br>

        You will receive a notification once the order is processed.,<br><br>

        Best regards,<br>
        <b>Locomeds</b>`,
  };

  transporter.sendMail(userMailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email to user:", error);
    } else {
      console.log("Email sent to user:", info.response);
    }
  });
}

module.exports = {
  sendEmailToVendorForNewOrder,
  sendEmailToUserForOrderConfirmation,
};
