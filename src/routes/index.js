/*
 *************************************************************************
 * @source  : index.js
 * @desc    : Index Router
 *------------------------------------------------------------------------
 * VER  DATE          AUTHOR      DESCRIPTION
 * ---  -----------  ----------  -----------------------------------------
 * 1.0  2018-09-11     맹지언      최초 작성
 * ---  -----------  ----------  -----------------------------------------
 * Project Description
 * Copyright(c) 2018 Simplatform,  All rights reserved.
 *************************************************************************
 */

// ##################################################
// 필수 추가
// ##################################################
const express = require('express');
const router = express.Router();
// ##################################################

router.get('/', (req, res) => res.redirect(301, 'v2'));

router.all("/", (req, res, next) => {
    res.status(405);
    next({});
});

router.get('/v2', (req, res) => res.render('index'));

router.all("/", (req, res, next) => {
    res.status(405);
    next({});
});

module.exports = router;
