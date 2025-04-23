const { createApp, ref, computed, watch } = Vue;

// 子组件：单个书籍条目
const BookItem = {
    props: ['book'],
    emits: ['toggle-status', 'delete-book', 'edit-book'],
    template: `
        <li :class="['book-item', book.status]">
            <div class="book-info">
                <h3>{{ book.title }}</h3>
                <p>作者: {{ book.author }}</p>
                <p>评分: {{ book.rating }}/5</p>
                <p>状态: <span class="status-text">{{ book.status === 'read' ? '已读' : '未读' }}</span></p>
                <!-- 确认这行存在，v-if 会在 review 为空字符串时不显示 -->
                <p v-if="book.review" class="book-review">读后感: {{ book.review }}</p>
            </div>
            <div class="book-actions">
                <button @click="$emit('toggle-status', book.id)">
                    {{ book.status === 'read' ? '标记未读' : '标记已读' }}
                </button>
                <button @click="$emit('edit-book', book)">编辑</button>
                <button @click="$emit('delete-book', book.id)" class="delete-btn">删除</button>
            </div>
        </li>
    `
};

const app = createApp({
    components: {
        BookItem
    },
    data() {
        return {
            pageTitle: '我的书单管理',
            bookList: [],
            showForm: false,
            isEditing: false,
            currentBook: this.getEmptyBook(), // 确保调用了 getEmptyBook
            nextId: 1, // 用于生成简单的唯一ID
            searchTerm: '',
            filterStatus: 'all', // 'all', 'read', 'unread'
            sortBy: 'id' // 'id', 'title', 'author', 'rating'
        };
    },
    computed: {
        // 过滤和排序后的书籍列表
        filteredAndSortedBooks() {
            let books = this.bookList;

            // 筛选
            if (this.filterStatus !== 'all') {
                books = books.filter(book => book.status === this.filterStatus);
            }

            // 搜索
            if (this.searchTerm) {
                const lowerSearchTerm = this.searchTerm.toLowerCase();
                books = books.filter(book =>
                    book.title.toLowerCase().includes(lowerSearchTerm) ||
                    book.author.toLowerCase().includes(lowerSearchTerm)
                );
            }

            // 排序
            books.sort((a, b) => {
                if (this.sortBy === 'title' || this.sortBy === 'author') {
                    return a[this.sortBy].localeCompare(b[this.sortBy]);
                } else if (this.sortBy === 'rating') {
                    return b.rating - a.rating; // 评分降序
                } else {
                    return a.id - b.id; // 默认按ID升序
                }
            });

            return books;
        },
        // 总书籍数
        totalBooks() {
            return this.bookList.length;
        },
        // 已读书籍数
        readBooksCount() {
            return this.bookList.filter(book => book.status === 'read').length;
        },
        // 未读书籍数
        unreadBooksCount() {
            return this.bookList.filter(book => book.status === 'unread').length;
        }
    },
    watch: {
        // 侦听书单变化，保存到 localStorage
        bookList: {
            handler(newList) {
                localStorage.setItem('myBookList', JSON.stringify(newList));
            },
            deep: true // 需要深度侦听对象数组内部的变化
        }
    },
    methods: {
        // 获取空书籍对象模板
        getEmptyBook() {
            // 确认返回的对象包含 review: ''
            return { id: null, title: '', author: '', rating: 3, status: 'unread', review: '' };
        },
        // 加载数据
        loadBooks() {
            const savedBooks = localStorage.getItem('myBookList');
            if (savedBooks) {
                this.bookList = JSON.parse(savedBooks);
                // 确保旧数据也有 review 字段 (使用 hasOwnProperty 更严谨)
                this.bookList.forEach(book => {
                    if (!book.hasOwnProperty('review')) {
                        book.review = '';
                    }
                });
            } else {
                // 添加更多初始示例数据和读后感
                this.bookList = [
                    { id: 1, title: '三体', author: '刘慈欣', rating: 5, status: 'read', review: '非常震撼的科幻巨作，对宇宙和人性的深刻思考。' },
                    { id: 2, title: '活着', author: '余华', rating: 4, status: 'read', review: '文字朴实，情感真挚，讲述了小人物在大时代下的坚韧。' },
                    { id: 3, title: '百年孤独', author: '加西亚·马尔克斯', rating: 5, status: 'unread', review: '' },
                    { id: 4, title: '围城', author: '钱钟书', rating: 4, status: 'read', review: '婚姻就像围城，城外的人想进去，城里的人想出来。讽刺又现实。' },
                    { id: 5, title: '挪威的森林', author: '村上春树', rating: 4, status: 'unread', review: '' },
                    { id: 6, title: '解忧杂货店', author: '东野圭吾', rating: 5, status: 'read', review: '温暖治愈的故事，每个烦恼背后都有动人的联系。' },
                    { id: 7, title: '人类简史', author: '尤瓦尔·赫拉利', rating: 5, status: 'unread', review: '' },
                ];
                this.nextId = 8; // 更新 nextId，因为现在最大的 id 是 7
            }
             // 确认 nextId 计算逻辑在 if/else 之后
             if (this.bookList.length > 0) {
                 // 确保从 localStorage 加载时也能正确设置 nextId
                 const maxId = Math.max(...this.bookList.map(b => b.id));
                 this.nextId = maxId >= 1 ? maxId + 1 : 1; // 处理空列表或只有一个元素的情况
             } else {
                 // 如果 localStorage 为空且没有默认数据（理论上不会进入这里，因为上面 else 分支会赋值）
                 this.nextId = 1;
             }
        },
        // 显示添加表单
        showAddForm() {
            this.isEditing = false;
            this.currentBook = this.getEmptyBook();
            this.showForm = true;
        },
        // 显示编辑表单
        showEditForm(book) {
            this.isEditing = true;
            // 确认使用了扩展运算符创建副本，会包含 review
            this.currentBook = { ...book };
            this.showForm = true;
        },
        // 取消表单
        cancelForm() {
            this.showForm = false;
            // 确认调用 getEmptyBook 重置，会包含 review
            this.currentBook = this.getEmptyBook();
        },
        // 保存书籍（添加或编辑）
        saveBook() {
            if (!this.currentBook.title || !this.currentBook.author) {
                alert('书名和作者不能为空！');
                return;
            }
            // 不需要特别处理 review，因为它已经是 currentBook 的一部分

            if (this.isEditing) {
                // 编辑
                const index = this.bookList.findIndex(b => b.id === this.currentBook.id);
                if (index !== -1) {
                    // 确认使用了扩展运算符更新，会包含 review
                    this.bookList.splice(index, 1, { ...this.currentBook });
                }
            } else {
                this.currentBook.id = this.nextId++;
                 // 确认使用了扩展运算符添加，会包含 review
                this.bookList.push({ ...this.currentBook });
            }
            this.cancelForm(); // 保存后关闭并重置表单
        },
        // 切换阅读状态
        toggleStatus(id) {
            const book = this.bookList.find(b => b.id === id);
            if (book) {
                book.status = book.status === 'read' ? 'unread' : 'read';
            }
        },
        // 确认删除
        confirmDelete(id) {
            if (confirm('确定要删除这本书吗？')) {
                this.deleteBook(id);
            }
        },
        // 删除书籍
        deleteBook(id) {
            this.bookList = this.bookList.filter(b => b.id !== id);
        }
    },
    mounted() {
        // 组件挂载后加载数据
        this.loadBooks();
    }
});

app.mount('#app');