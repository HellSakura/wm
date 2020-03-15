package main

import (
	"fmt"
	"os"
	"regexp"

	api "github.com/appleboy/gin-status-api"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

const (
	port         = ":5678"
	downloadPath = "./download/"
	dbPath       = "./wm.db"
)

var (
	reg = regexp.MustCompile("[\\\\/:*?\"<>|]")
	db  *gorm.DB
)

func main() {
	if err := os.MkdirAll(downloadPath, os.ModePerm); err != nil {
		fmt.Println("创建目录：", downloadPath, " 失败")
		return
	}

	if sdb, err := gorm.Open("sqlite3", dbPath); err != nil {
		fmt.Println("打开数据库失败：", err.Error())
		return
	} else {
		db = sdb
	}

	db.AutoMigrate(&Task{})

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery(), cors.Default())

	fmt.Println("请输入数字选择模式：1. 添加任务 2.分发任务")
	mode := 0
	fmt.Scanf("%d", &mode)

	router.POST("/add", addTask)
	router.GET("/status", api.GinHandler)
	if mode == 1 {
		fmt.Println("请打开对应得课程播放页面点击左边的添加任务，支持添加多个课程")
	} else {
		router.GET("/get", getTask)
		router.POST("/finish", finishTask)
		fmt.Println("请打开任意数量的课程播放页面，开始获取...")
	}

	router.Run(port)
}
