var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const JWT = require('jsonwebtoken');
const config = require("../ultil/tokenConFig");

dotenv.config();

var sinhvien = require("../model/sinhvien");
const e = require('express');

//lấy ds tất cả
router.get("/all", async function (req, res) {
  try {
    const token = req.header("Authorization").split(' ')[1];
  if(token){
    JWT.verify(token, config.SECRETKEY, async function (err, id){
      if(err){
        res.status(403).json({"status": false, message: "Có lỗi xảy ra"});
      }else{
        var list = await sinhvien.find(); 
        res.status(200).json(list);
      }
    });
  }else{
    res.status(401).json({status: false, message: "Không xác thực"});
  }
   
  } catch (e) {
    res.status(400).json({ status: false, message: "Có lỗi xảy ra: " + e }); 
  }
});

//http://localhost:3000/sinhvien/monhoc?mon=CNTT
//lấy ds sinh viên khoa CNTT
router.get("/monhoc", async function (req, res) {
  const { mon } = req.query; // Lấy môn học từ query parameter
  try {
    const token = req.header("Authorization").split(' ')[1];
  if(token){
    JWT.verify(token, config.SECRETKEY, async function (err, id){
      if(err){
        res.status(403).json({"status": false, message: "Có lỗi xảy ra"});
      }else{
        const list = await sinhvien.find({ mon: mon }); // Tìm sinh viên theo môn học
        res.json(list);
      }
    });
  }else{
    res.status(401).json({status: false, message: "Không xác thực"});
  }
    
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});



//http://localhost:3000/sinhvien/diem?min=6.5&max=8.5
//lấy toàn bộ sv điểm từ 6.5-->8.5
router.get("/diem", async function (req, res) {
  const { min, max } = req.query;
  const minDiem = parseFloat(min);
  const maxDiem = parseFloat(max);

  try {
    const token = req.header("Authorization").split(' ')[1];
    if(token){
      JWT.verify(token, config.SECRETKEY, async function (err, id){
        if(err){
          res.status(403).json({"status": false, message: "Có lỗi xảy ra"});
        }else{
          const list = await sinhvien.find({
      diemtb: { $gte: minDiem, $lte: maxDiem }
    });
        }
      });
    }else{
      res.status(401).json({status: false, message: "Không xác thực"});
    }
    
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});


//tìm kiếm thoong tin theo mssv
router.get("/thongtin/:id", async function (req, res) {
  const token = req.header("Authorization").split(' ')[1];
    if(token){
      JWT.verify(token, config.SECRETKEY, async function (err, id){
        if(err){
          res.status(403).json({"status": false, message: "Có lỗi xảy ra"});
        }else{
          var list = await sinhvien.findById(req.params.id);
  res.json(list);
        }
      });
    }else{
      res.status(401).json({status: false, message: "Không xác thực"});
    }
 
});

//thêm 1 sv mới
router.post("/add", async function (req, res) {
  try {
    const token = req.header("Authorization").split(' ')[1];
    if(token){
      JWT.verify(token, config.SECRETKEY, async function (err, id){
        if(err){
          res.status(403).json({"status": false, message: "Có lỗi xảy ra"});
        }else{
         const { hoten, diemtb, mon, tuoi } = req.body;
    const newItem = { hoten, diemtb, mon, tuoi };
    await sinhvien.create(newItem);
    res.status(200).json({ status: true, message: "thêm thành công" }); 
        }
      });
    }else{
      res.status(401).json({status: false, message: "Không xác thực"});
    }
    
  } catch (error) {
    res.status(400).json({ status: false, message: "có lỗi xảy ra" });
  }

});

//thay đổi thông thông tin
router.put("/edit", async function (req, res) {
  try {
    const { id, hoten, diemtb, mon, tuoi } = req.body;
    //tìm sp chỉnh sửa
    const findSV = await sinhvien.findById(id);
    if (findSV) {
      findSV.hoten = hoten ? hoten : findSV.hoten;
      findSV.diemtb = diemtb ? diemtb : findSV.diemtb;
      findSV.mon = mon ? mon : findSV.mon;
      findSV.tuoi = tuoi ? tuoi : findSV.tuoi;
      await findSV.save();
      res.status(200).json({ status: true, message: "sửa thành công" });
    }
    else {
      res.status(400).json({ status: false, message: "chưa tìm thấy sp" });
    }
  } catch (error) {
    res.status(400).json({ status: false, message: "có lỗi xảy ra" });
  }

});

//xóa 1 sinh viên
router.delete("/delete/:id", async function (req, res) {
  try {
    const { id } = req.params;
    await sinhvien.findByIdAndDelete(id);
    res.status(200).json({ status: true, message: "thành công" });
  } catch (e) {
    res.status(400).json({ status: false, message: "kh thành công" });
  }
});

//Lấy danh sách các sinh viên thuộc BM CNTT và có DTB từ 9.0
router.get("/MONVDIEM", async function (req, res) {
  try {
    const { mon, diemtb } = req.query;
    var list = await sinhvien.find({ $and: [{ mon: mon }, { diemtb: { $gte: parseFloat(diemtb) } }] });
    res.json(list);
  }
  catch (error) {
    res.status(400).json({ status: false, message: "kh thành công" });
  }
});


//Lấy ra danh sách các sinh viên có độ tuổi từ 18 đến 20 thuộc CNTT có điểm trung bình từ 6.5
router.get("/CNTT&T&DTB", async function (req, res) {
  try {
    const list = await sinhvien.find({
      mon: "CNTT",
      diemtb: { $gte: 6.5 },
      tuoi: { $gte: 18, $lte: 20 },
    });
    res.json(list);
  } catch (error) {
    res.status(500).send("Lỗi server");
  }
});

//diem tb tăng dần
router.get("/tangdan", async function (req, res) {
  try {
    const list = await sinhvien.find().sort({ diemtb: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ status: false, message: "Lỗi server" });
  }
});

// Tìm sinh viên có điểm trung bình cao nhất thuộc BM CNTT
router.get("/diemtbcaonhat", async function (req, res) {
  try {
    const { mon, limit } = req.query; // Lấy tham số từ query
    const limitNumber = parseInt(limit) || 2;
    const list = await sinhvien
      .find(mon ? { mon } : {})
      .sort({ diemtb: -1 })
      .limit(limitNumber);
    res.json(list);
  } catch (error) {
    res.status(500).json({ status: false, message: "Lỗi server" });
  }
});


module.exports = router;


router.post("/login", async function (req, res) {
  try {
    const { username, password } = req.body;
    const user = await userModel.findOne({ username: username });

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
    const token = JWT.sign({ user: userObject }, process.env.SECRETKEY, { expiresIn: '1h' });

    res.status(200).json({ status: true, message: "Đăng nhập thành công", token: token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: "Đã xảy ra lỗi" });
  }
});

// đăng ký

router.post("/register", async function (req, res) {
  try {
    const { username, password } = req.body;
    const user = await userModel.findOne({ username: username });
    if (user) {
      return res.status(409).json({ status: false, message: "Tên đăng nhập đã tồn tại" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ status: true, message: "Đăng ký thành công" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: "Đã xảy ra lỗi" });
  }
});

// test lấy thông tin từ token

router.get("/me", async function (req, res) {
  try {
    //lấy header từ request
    const token = req.header("Authorization").replace("Bearer ", "");
    //decode token
    const decoded = jwt.verify(token, process.env.SECRETKEY);
    //lấy user từ id
    const user = await userModel.findById(decoded?.user?._id);
    //kiểm tra xem user đã tồn tại hay chưa
    if (!user) {
      return res.status(401).json({ status: false, message: "Token không hợp lệ" });
    }
    res.json(decoded.user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: "Đã xảy ra lỗi" });
  }
});