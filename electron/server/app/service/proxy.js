const { Service } = require('egg');
const fs = require('fs');
const path = require('path');
const paths = require('../../config/paths');

class ProxyService extends Service {
  constructor(ctx) {
    super(ctx);
    // 初始化全局代理状态
    this.proxyEnabled = process.env.GLOBAL_AGENT_HTTP_PROXY ? true : false;
  }

  /**
   * 获取代理配置
   */
  async getProxyConfig() {
    try {
      // 配置文件路径
      const configFile = path.join(paths.configPath, 'proxy.config.json');
      
      // 如果配置文件不存在，返回默认配置
      if (!fs.existsSync(configFile)) {
        return {
          enabled: this.proxyEnabled,
          http: process.env.GLOBAL_AGENT_HTTP_PROXY,
          https: process.env.GLOBAL_AGENT_HTTPS_PROXY
        };
      }

      // 读取配置文件
      const configContent = fs.readFileSync(configFile, 'utf8');
      const config = JSON.parse(configContent);
      
      // 确保返回当前实际状态
      config.enabled = this.proxyEnabled;
      
      return config;
    } catch (error) {
      this.ctx.logger.error('获取代理配置失败:', error);
      throw error;
    }
  }

  /**
   * 保存代理配置
   */
  async saveProxyConfig(config) {
    try {
      // 确保配置目录存在
      if (!fs.existsSync(paths.configPath)) {
        fs.mkdirSync(paths.configPath, { recursive: true });
      }

      // 配置文件路径
      const configFile = path.join(paths.configPath, 'proxy.config.json');
      
      // 写入配置文件
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
      
      return { success: true };
    } catch (error) {
      this.ctx.logger.error('保存代理配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新代理配置
   */
  async updateProxyConfig(proxyConfig) {
    try {
      // 获取当前配置
      const currentConfig = await this.getProxyConfig();
      
      // 合并新配置
      const newConfig = {
        ...currentConfig,
        ...proxyConfig
      };
      
      // 保存配置
      await this.saveProxyConfig(newConfig);
      
      // 如果代理已启用，则应用新配置
      if (newConfig.enabled) {
        await this.applyProxySettings(newConfig);
      }
      
      return {
        success: true,
        config: newConfig
      };
    } catch (error) {
      this.ctx.logger.error('更新代理配置失败:', error);
      throw error;
    }
  }

  /**
   * 应用代理设置
   */
  async applyProxySettings(config) {
    try {
      // 设置环境变量
      process.env.GLOBAL_AGENT_HTTP_PROXY = config.http;
      process.env.GLOBAL_AGENT_HTTPS_PROXY = config.https;
      
      // 更新状态
      this.proxyEnabled = true;
      
      this.ctx.logger.info('代理设置已应用:', {
        http: config.http,
        https: config.https
      });
      
      return { success: true };
    } catch (error) {
      this.ctx.logger.error('应用代理设置失败:', error);
      throw error;
    }
  }

  /**
   * 启用代理
   */
  async enableProxy() {
    try {
      // 获取当前配置
      const config = await this.getProxyConfig();
      
      // 设置启用状态
      config.enabled = true;
      
      // 应用代理设置
      await this.applyProxySettings(config);
      
      // 保存配置
      await this.saveProxyConfig(config);
      
      // 重新加载 global-agent
      try {
        require('global-agent/bootstrap');
      } catch (error) {
        this.ctx.logger.error('重新加载 global-agent 失败:', error);
      }
      
      return {
        success: true,
        message: '代理已启用',
        config
      };
    } catch (error) {
      this.ctx.logger.error('启用代理失败:', error);
      throw error;
    }
  }

  /**
   * 禁用代理
   */
  async disableProxy() {
    try {
      // 获取当前配置
      const config = await this.getProxyConfig();
      
      // 设置禁用状态
      config.enabled = false;
      
      // 清除环境变量
      delete process.env.GLOBAL_AGENT_HTTP_PROXY;
      delete process.env.GLOBAL_AGENT_HTTPS_PROXY;
      
      // 更新状态
      this.proxyEnabled = false;
      
      // 保存配置
      await this.saveProxyConfig(config);
      
      this.ctx.logger.info('代理已禁用');
      
      return {
        success: true,
        message: '代理已禁用',
        config
      };
    } catch (error) {
      this.ctx.logger.error('禁用代理失败:', error);
      throw error;
    }
  }
}

module.exports = ProxyService;