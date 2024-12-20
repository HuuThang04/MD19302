var express = require('express');
var router = express.Router();

var usermodel = require("../model/usermodel");
var product = require("../model/product");
var upload = require("../ultil/uploadConfig");
var sendMail = require("../ultil/mailConfig");
const JWT = require('jsonwebtoken');
const config = require("../ultil/tokenConFig");
const bcrypt = require('bcryptjs');



router.get("/all", async function (req, res) {
  var list = await product.find().populate('category');
  res.json(list);
});


router.get("/soluong", async function (req, res) {
  var list = await product.find({ soluong: { $gt: 9 } });
  res.json(list);
});


router.get("/gia", async function (req, res) {
  var list = await product.find({ gia: { $gte: 50000, $lte: 200000 } });
  res.json(list);
});

router.get("/slvagia", async function (req, res) {
  var list = await product.find({ $or: [{ soluong: { $lt: 10 } }, { gia: { $gt: 200000 } }] });
  res.json(list);
});


router.get("/chitiet/:id", async function (req, res) {
  var list = await product.findById(req.params.id);
  res.json(list);
});
module.exports = router;


//thêm 1 sp
router.post("/add", async function (req, res) {
  try {
    const { tensp, gia, soluong } = req.body;
    const newItem = { tensp, gia, soluong };
    await product.create(newItem);
    res.status(200).json({ status: true, message: "thêm thành công" });
  } catch (error) {
    res.status(400).json({ status: false, message: "có lỗi xảy ra" });
  }

});

//chỉnh sữa
router.put("/edit/:id", async function (req, res) {
  try {
    const { id, tensp, gia, soluong } = req.body;
    //tìm sp chỉnh sửa
    const findProduct = await product.findById(id);
    if (findProduct) {
      findProduct.tensp = tensp ? tensp : findProduct.tensp;
      findProduct.gia = gia ? gia : findProduct.gia;
      findProduct.soluong = soluong ? soluong : findProduct.soluong;
      await findProduct.save();
      res.status(200).json({ status: true, message: "sửa thành công" });
    }
    else {
      res.status(400).json({ status: false, message: "chưa tìm thấy sp" });
    }
  } catch (error) {
    res.status(400).json({ status: false, message: "có lỗi xảy ra" });
  }

})
//upload file
router.post('/upload', [upload.single('image')],
  async (req, res, next) => {
    try {
      const { file } = req;
      if (!file) {
        return res.json({ status: 0, link: "" });
      } else {
        const url = `http://localhost:3000/images/${file.filename}`;
        return res.json({ status: 1, url: url });
      }
    } catch (error) {
      console.log('Upload image error: ', error);
      return res.json({ status: 0, link: "" });
    }
  });


//email
router.post("/send-mail", async function (req, res, next) {
  try {
    const { to, subject, content } = req.body;

    const mailOptions = {
      from: "Hữu Thắng <thangpdhps41021@gmail.com>",
      to: to,
      subject: subject,
      html: content
    };
    await sendMail.transporter.sendMail(mailOptions);
    res.json({ status: 1, message: "Gửi mail t mhành công" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.json({ status: 0, message: "Gửi mail thất bại", error: err.message });
  }
});

//Đăng nhập
router.post("/login", async function (req, res) {
  try {
    const { username, password } = req.body;
    const user = await usermodel.findOne({ username: username });

    if (!user) {
      return res.status(401).json({ status: false, message: "Tên đăng nhập không tồn tại" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ status: false, message: "Mật khẩu không đúng" });
    }

    // Tạo JWT
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.refreshToken;
    const accessToken = JWT.sign({ user: userObject }, process.env.SECRETKEY, { expiresIn: '1h' });
    const refreshToken = JWT.sign({ user: userObject }, process.env.REFRESH_SECRETKEY, { expiresIn: '7d' });
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      status: true,
      message: "Đăng nhập thành công",
      accessToken: accessToken,
      refreshToken: refreshToken
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: "Đã xảy ra lỗi" });
  }
});

router.post("/refresh", async function (req, res) {
  const refreshToken = req.body.refreshToken || req.headers.authorization?.split(" ")[1]; // Lấy refresh token từ body hoặc header

  if (!refreshToken) {
    return res.status(401).json({ status: false, message: "Refresh token không được cung cấp" });
  }

  try {
    const decoded = JWT.verify(refreshToken, process.env.REFRESH_SECRETKEY);
    const user = await usermodel.findOne({ username: decoded.user.username, refreshToken: refreshToken });

    if (!user) {
      return res.status(401).json({ status: false, message: "Refresh token không hợp lệ" });
    }
    const localUser = user.toObject();
    delete localUser.refreshToken;
    delete localUser.password;
    const accessToken = JWT.sign({ user: localUser }, process.env.SECRETKEY, { expiresIn: '1h' });

    // Optionally, delete old refresh token and generate a new one.
    // user.refreshToken = null; // Xóa refresh token cũ
    // await user.save();

    res.json({ accessToken: accessToken });
  } catch (error) {
    console.error(error);
    res.status(401).json({ status: false, message: "Refresh token không hợp lệ" });
  }
});